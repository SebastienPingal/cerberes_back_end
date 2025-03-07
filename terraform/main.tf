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

# VPC for our resources
resource "aws_vpc" "app_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "${var.app_name}-vpc"
  }
  
  # Prevent accidental deletion
  lifecycle {
    prevent_destroy = false  # Set to true in production
  }
}

# Public subnet for EC2
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.app_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.app_name}-public-subnet"
  }
}

# Private subnet for RDS
resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.app_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}a"
  tags = {
    Name = "${var.app_name}-private-subnet-1"
  }
}

# Second private subnet for RDS (required for DB subnet group)
resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.app_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}b"
  tags = {
    Name = "${var.app_name}-private-subnet-2"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.app_vpc.id
  tags = {
    Name = "${var.app_name}-igw"
  }
  
  # Prevent accidental deletion
  lifecycle {
    prevent_destroy = false  # Set to true in production
  }
}

# Route Table for public subnet
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.app_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = {
    Name = "${var.app_name}-public-rt"
  }
}

# Route Table Association
resource "aws_route_table_association" "public_rta" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# Output the VPC ID for reference
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.app_vpc.id
}

# Output the region for reference
output "aws_region" {
  description = "AWS region used"
  value       = var.aws_region
} 