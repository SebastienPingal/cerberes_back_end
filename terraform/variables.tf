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

variable "existing_ec2_sg_id" {
  description = "The ID of an existing EC2 security group to use (optional)"
  type        = string
  default     = ""
}

variable "subnet_a_exists" {
  description = "Whether private subnet A already exists"
  type        = bool
  default     = false
}

variable "subnet_a_id" {
  description = "The ID of an existing private subnet A (optional)"
  type        = string
  default     = ""
}

variable "subnet_b_exists" {
  description = "Whether private subnet B already exists"
  type        = bool
  default     = false
}

variable "subnet_b_id" {
  description = "The ID of an existing private subnet B (optional)"
  type        = string
  default     = ""
}