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

# Local variables for VPC and subnet selection
locals {
  # Use the default VPC ID
  vpc_id = data.aws_vpc.default.id

  # Get public subnets in the default VPC
  public_subnet_ids = length(data.aws_subnets.public.ids) > 0 ? data.aws_subnets.public.ids : []

  # Use public subnet ID for EC2
  public_subnet_id = length(local.public_subnet_ids) > 0 ? local.public_subnet_ids[0] : null
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

# Create an Internet Gateway only if one doesn't exist
resource "aws_internet_gateway" "igw" {
  # Only create if no internet gateway is attached to the VPC
  count  = length(data.aws_internet_gateway.existing) > 0 ? 0 : 1
  vpc_id = local.vpc_id

  tags = {
    Name = "${var.app_name}-igw"
  }

  # This prevents errors if the VPC already has an internet gateway
  lifecycle {
    create_before_destroy = true
  }
}

# Create a route table for public subnets
resource "aws_route_table" "public_rt" {
  vpc_id = local.vpc_id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = length(data.aws_internet_gateway.existing) > 0 ? data.aws_internet_gateway.existing.id : aws_internet_gateway.igw[0].id
  }

  tags = {
    Name = "${var.app_name}-public-rt"
  }
}

# Associate the route table with public subnets
resource "aws_route_table_association" "public_rta" {
  count          = length(local.public_subnet_ids)
  subnet_id      = local.public_subnet_ids[count.index]
  route_table_id = aws_route_table.public_rt.id
}
