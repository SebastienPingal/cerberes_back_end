terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.2.0"
  
  # Uncomment this block to use S3 backend for state management in production
  # backend "s3" {
  #   bucket         = "cerberes-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "eu-west-1"
  #   encrypt        = true
  #   dynamodb_table = "cerberes-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region
  
  # Add default tags to all resources
  default_tags {
    tags = {
      Project     = var.app_name
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}

# Use the default VPC
data "aws_vpc" "default" {
  default = true
}

# Get VPC CIDR block
data "aws_vpc" "selected" {
  id = data.aws_vpc.default.id
}

# Local variables for VPC and subnet selection
locals {
  # Use the default VPC ID
  vpc_id = data.aws_vpc.default.id
  
  # Get public subnets in the default VPC
  public_subnet_ids = length(data.aws_subnets.public.ids) > 0 ? data.aws_subnets.public.ids : []
  
  # Get private subnets in the default VPC, or use public subnets if no private subnets exist
  private_subnet_ids = length(data.aws_subnets.private.ids) > 0 ? data.aws_subnets.private.ids : local.public_subnet_ids
  
  # Get the public subnet ID to use for EC2
  public_subnet_id = length(local.public_subnet_ids) > 0 ? local.public_subnet_ids[0] : null
  
  # Create subnets in two availability zones for RDS (minimum required)
  # Check for existing subnets with the same name
  existing_private_subnets = data.aws_subnets.existing_private_subnets.ids
  existing_subnet_count = length(data.aws_subnets.existing_private_subnets.ids)
  
  # Use the variables from CD workflow to determine if subnets exist
  create_subnet_a = !var.subnet_a_exists
  create_subnet_b = !var.subnet_b_exists
  
  # IDs to use for the subnets (either existing or new)
  subnet_a_id = var.subnet_a_exists ? var.subnet_a_id : (length(aws_subnet.private_subnet_a) > 0 ? aws_subnet.private_subnet_a[0].id : null)
  subnet_b_id = var.subnet_b_exists ? var.subnet_b_id : (length(aws_subnet.private_subnet_b) > 0 ? aws_subnet.private_subnet_b[0].id : null)
  
  # Internet gateway ID - try to use existing one first, then our created one if it exists
  igw_id = try(data.aws_internet_gateway.existing.id, length(aws_internet_gateway.igw) > 0 ? aws_internet_gateway.igw[0].id : null)
  
  # VPC CIDR information
  vpc_cidr = data.aws_vpc.selected.cidr_block
  # Extract first two octets from VPC CIDR (e.g., "172.31" from "172.31.0.0/16")
  vpc_prefix = join(".", slice(split(".", local.vpc_cidr), 0, 2))
}

# Get public subnets in the default VPC
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [local.vpc_id]
  }
  
  filter {
    name   = "map-public-ip-on-launch"
    values = ["true"]
  }
}

# Get private subnets in the default VPC
data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [local.vpc_id]
  }
  
  filter {
    name   = "map-public-ip-on-launch"
    values = ["false"]
  }
}

# Check for existing internet gateway in the VPC
data "aws_internet_gateway" "existing" {
  filter {
    name   = "attachment.vpc-id"
    values = [local.vpc_id]
  }
  
  # This prevents errors if no internet gateway is found
  depends_on = [data.aws_vpc.default]
}

# Output the VPC ID
output "vpc_id" {
  value       = local.vpc_id
  description = "The ID of the VPC"
}

# Output the AWS region
output "aws_region" {
  value       = var.aws_region
  description = "The AWS region"
}

# Output the public subnet ID
output "public_subnet_id" {
  value       = local.public_subnet_id
  description = "The ID of the public subnet"
}

# Output the private subnet IDs
output "private_subnet_ids" {
  value       = local.private_subnet_ids
  description = "The IDs of the private subnets"
}

# Create subnets in two availability zones for RDS (minimum required)
# Check for existing subnets with the same name
data "aws_subnets" "existing_private_subnets" {
  filter {
    name   = "vpc-id"
    values = [local.vpc_id]
  }
  
  filter {
    name   = "tag:Name"
    values = ["${var.app_name}-private-subnet-a", "${var.app_name}-private-subnet-b"]
  }
}

resource "aws_subnet" "private_subnet_a" {
  count             = local.create_subnet_a ? 1 : 0
  vpc_id            = local.vpc_id
  # Use CIDR blocks based on VPC CIDR
  cidr_block        = "${local.vpc_prefix}.101.0/24"
  availability_zone = "${var.aws_region}a"
  
  tags = {
    Name = "${var.app_name}-private-subnet-a"
  }
}

resource "aws_subnet" "private_subnet_b" {
  count             = local.create_subnet_b ? 1 : 0
  vpc_id            = local.vpc_id
  # Use CIDR blocks based on VPC CIDR
  cidr_block        = "${local.vpc_prefix}.102.0/24"
  availability_zone = "${var.aws_region}b"
  
  tags = {
    Name = "${var.app_name}-private-subnet-b"
  }
}

# Create an Internet Gateway only if one doesn't exist
resource "aws_internet_gateway" "igw" {
  # Only create if no internet gateway is attached to the VPC
  count = var.create_igw ? 1 : 0
  vpc_id = local.vpc_id
  
  tags = {
    Name = "${var.app_name}-igw"
  }
  
  # This prevents errors if the VPC already has an internet gateway
  lifecycle {
    create_before_destroy = true
  }
}

# Create a route table for the private subnets
resource "aws_route_table" "private_rt" {
  vpc_id = local.vpc_id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = local.igw_id
  }
  
  tags = {
    Name = "${var.app_name}-private-rt"
  }
}

# Associate the route table with the private subnets
resource "aws_route_table_association" "private_rta_a" {
  count          = length(aws_subnet.private_subnet_a)
  subnet_id      = aws_subnet.private_subnet_a[count.index].id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route_table_association" "private_rta_b" {
  count          = length(aws_subnet.private_subnet_b)
  subnet_id      = aws_subnet.private_subnet_b[count.index].id
  route_table_id = aws_route_table.private_rt.id
}