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

# Look for existing VPCs
data "aws_vpcs" "existing" {
  count = 0  # This will be set to 1 by the workflow if we want to use existing VPCs
}

# Use the default VPC if available
data "aws_vpc" "default" {
  count = length(data.aws_vpcs.existing) > 0 ? 0 : 1
  default = true
}

# Local variables for VPC and subnet selection
locals {
  # Determine if we should use an existing VPC
  use_existing_vpc = length(data.aws_vpcs.existing) > 0 && length(data.aws_vpcs.existing[0].ids) > 0
  
  # Get the VPC ID to use
  vpc_id = local.use_existing_vpc ? data.aws_vpcs.existing[0].ids[0] : length(data.aws_vpc.default) > 0 ? data.aws_vpc.default[0].id : null
  
  # Flag to indicate if we need to create subnets
  create_subnets = local.vpc_id != null
}

# Look for existing public subnets in the VPC
data "aws_subnets" "public" {
  count = local.use_existing_vpc ? 1 : 0
  
  filter {
    name   = "vpc-id"
    values = [local.vpc_id]
  }
  
  filter {
    name   = "map-public-ip-on-launch"
    values = ["true"]
  }
}

# Look for existing private subnets in the VPC
data "aws_subnets" "private" {
  count = local.use_existing_vpc ? 1 : 0
  
  filter {
    name   = "vpc-id"
    values = [local.vpc_id]
  }
}

# Public subnet for EC2 - only created if needed
resource "aws_subnet" "public_subnet" {
  count                   = local.create_subnets && (length(data.aws_subnets.public) == 0 || length(data.aws_subnets.public[0].ids) == 0) ? 1 : 0
  vpc_id                  = local.vpc_id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.app_name}-public-subnet"
  }
}

# Private subnet for RDS - only created if needed
resource "aws_subnet" "private_subnet_1" {
  count             = local.create_subnets && (length(data.aws_subnets.private) == 0 || length(data.aws_subnets.private[0].ids) < 2) ? 1 : 0
  vpc_id            = local.vpc_id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}a"
  tags = {
    Name = "${var.app_name}-private-subnet-1"
  }
}

# Second private subnet for RDS (required for DB subnet group) - only created if needed
resource "aws_subnet" "private_subnet_2" {
  count             = local.create_subnets && (length(data.aws_subnets.private) == 0 || length(data.aws_subnets.private[0].ids) < 2) ? 1 : 0
  vpc_id            = local.vpc_id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}b"
  tags = {
    Name = "${var.app_name}-private-subnet-2"
  }
}

# Internet Gateway - only created if needed
resource "aws_internet_gateway" "igw" {
  count  = local.create_subnets && (length(data.aws_subnets.public) == 0 || length(data.aws_subnets.public[0].ids) == 0) ? 1 : 0
  vpc_id = local.vpc_id
  tags = {
    Name = "${var.app_name}-igw"
  }
}

# Route Table for public subnet - only created if needed
resource "aws_route_table" "public_rt" {
  count  = local.create_subnets && (length(data.aws_subnets.public) == 0 || length(data.aws_subnets.public[0].ids) == 0) ? 1 : 0
  vpc_id = local.vpc_id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw[0].id
  }
  tags = {
    Name = "${var.app_name}-public-rt"
  }
}

# Route Table Association - only created if needed
resource "aws_route_table_association" "public_rta" {
  count          = local.create_subnets && (length(data.aws_subnets.public) == 0 || length(data.aws_subnets.public[0].ids) == 0) ? 1 : 0
  subnet_id      = aws_subnet.public_subnet[0].id
  route_table_id = aws_route_table.public_rt[0].id
}

# Output the VPC ID for reference
output "vpc_id" {
  description = "ID of the VPC"
  value       = local.vpc_id
}

# Output the region for reference
output "aws_region" {
  description = "AWS region used"
  value       = var.aws_region
}

# Output the subnet IDs
output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = length(data.aws_subnets.public) > 0 && length(data.aws_subnets.public[0].ids) > 0 ? data.aws_subnets.public[0].ids[0] : (length(aws_subnet.public_subnet) > 0 ? aws_subnet.public_subnet[0].id : null)
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = length(data.aws_subnets.private) > 0 && length(data.aws_subnets.private[0].ids) >= 2 ? [data.aws_subnets.private[0].ids[0], data.aws_subnets.private[0].ids[1]] : (length(aws_subnet.private_subnet_1) > 0 && length(aws_subnet.private_subnet_2) > 0 ? [aws_subnet.private_subnet_1[0].id, aws_subnet.private_subnet_2[0].id] : [])
} 