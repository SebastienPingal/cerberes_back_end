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
  
  # Get private subnets in the default VPC, or use public subnets if no private subnets exist
  private_subnet_ids = length(data.aws_subnets.private.ids) > 0 ? data.aws_subnets.private.ids : local.public_subnet_ids
  
  # Get the public subnet ID to use for EC2
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