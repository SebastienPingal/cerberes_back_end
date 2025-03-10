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
  count = 0  # Always set to 0 to avoid errors
  
  filter {
    name   = "isDefault"
    values = ["true"]
  }
}

# Use the default VPC if available
data "aws_vpc" "default" {
  count = length(data.aws_vpcs.existing) > 0 ? 0 : 1
  default = true
}

# Local variables for VPC and subnet selection
locals {
  # Determine if we should use an existing VPC - safely handle empty tuples
  use_existing_vpc = false  # Default to not using existing VPC
  
  # Get the VPC ID to use
  vpc_id = length(data.aws_vpc.default) > 0 ? data.aws_vpc.default[0].id : null
  
  # Flag to indicate if we need to create subnets
  create_subnets = local.vpc_id != null
}

# Look for existing public subnets in the VPC
data "aws_subnets" "public" {
  count = 0  # Always set to 0 to avoid errors
  
  filter {
    name   = "vpc-id"
    values = [local.vpc_id != null ? local.vpc_id : "vpc-placeholder"]
  }
}

# Look for existing private subnets in the VPC
data "aws_subnets" "private" {
  count = 0  # Always set to 0 to avoid errors
  
  filter {
    name   = "vpc-id"
    values = [local.vpc_id != null ? local.vpc_id : "vpc-placeholder"]
  }
}

# Public subnet for the EC2 instance
resource "aws_subnet" "public_subnet" {
  count                   = local.create_subnets ? 1 : 0
  vpc_id                  = local.vpc_id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.app_name}-public-subnet"
  }
}

# Private subnet 1 for the RDS instance
resource "aws_subnet" "private_subnet_1" {
  count             = local.create_subnets ? 1 : 0
  vpc_id            = local.vpc_id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}a"
  
  tags = {
    Name = "${var.app_name}-private-subnet-1"
  }
}

# Private subnet 2 for the RDS instance (RDS requires at least 2 subnets in different AZs)
resource "aws_subnet" "private_subnet_2" {
  count             = local.create_subnets ? 1 : 0
  vpc_id            = local.vpc_id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}b"
  
  tags = {
    Name = "${var.app_name}-private-subnet-2"
  }
}

# Internet Gateway for the public subnet
resource "aws_internet_gateway" "igw" {
  count  = local.create_subnets ? 1 : 0
  vpc_id = local.vpc_id
  
  tags = {
    Name = "${var.app_name}-igw"
  }
}

# Route table for the public subnet
resource "aws_route_table" "public_rt" {
  count  = local.create_subnets ? 1 : 0
  vpc_id = local.vpc_id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw[0].id
  }
  
  tags = {
    Name = "${var.app_name}-public-rt"
  }
}

# Associate the route table with the public subnet
resource "aws_route_table_association" "public_rta" {
  count          = local.create_subnets ? 1 : 0
  subnet_id      = aws_subnet.public_subnet[0].id
  route_table_id = aws_route_table.public_rt[0].id
}

# Output the VPC ID for reference
output "vpc_id" {
  description = "VPC ID"
  value       = local.vpc_id
}

# Output the region for reference
output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

# Output the subnet IDs
output "public_subnet_id" {
  description = "Public subnet ID"
  value       = length(aws_subnet.public_subnet) > 0 ? aws_subnet.public_subnet[0].id : null
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = length(aws_subnet.private_subnet_1) > 0 && length(aws_subnet.private_subnet_2) > 0 ? [aws_subnet.private_subnet_1[0].id, aws_subnet.private_subnet_2[0].id] : []
} 