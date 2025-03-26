variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "The name of the application"
  type        = string
  default     = "cerberes"
}

variable "db_username" {
  description = "The username for the database"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "The password for the database"
  type        = string
  sensitive   = true
}

variable "ssh_key_name" {
  description = "The name of the SSH key pair to use for EC2 instances"
  type        = string
}

variable "ec2_instance_type" {
  description = "The instance type for the EC2 instance"
  type        = string
  default     = "t2.micro"
}

variable "db_instance_class" {
  description = "The instance class for the RDS instance"
  type        = string
  default     = "db.t3.micro"
}

variable "security_group_id" {
  description = "The ID of an existing security group to use (optional)"
  type        = string
  default     = ""
}

variable "create_igw" {
  description = "Whether to create an internet gateway"
  type        = bool
  default     = true
}

variable "db_subnet_group_exists" {
  description = "Whether to use an existing DB subnet group"
  type        = bool
  default     = false
}

variable "ec2_exists" {
  description = "Whether an EC2 instance already exists"
  type        = bool
  default     = false
}

variable "ec2_id" {
  description = "The ID of the existing EC2 instance"
  type        = string
  default     = ""
}