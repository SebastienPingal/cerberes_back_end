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

variable "db_subnet_group_id" {
  description = "The ID of an existing DB subnet group to use (optional)"
  type        = string
  default     = ""
}

variable "db_endpoint" {
  description = "The endpoint of the existing RDS instance"
  type        = string
  default     = ""
}

variable "ec2_id" {
  description = "The ID of the existing EC2 instance"
  type        = string
  default     = ""
}

variable "subnet_az_a_id" {
  description = "The ID of the existing subnet in AZ A"
  type        = string
  default     = ""
}

variable "subnet_az_b_id" {
  description = "The ID of the existing subnet in AZ B"
  type        = string
  default     = ""
}

variable "subnet_az_a_capacity" {
  description = "The capacity of the existing subnet in AZ A"
  type        = number
  default     = 0
}

variable "subnet_az_b_capacity" {
  description = "The capacity of the existing subnet in AZ B"
  type        = number
  default     = 0
}

variable "nat_instance_id" {
  description = "The ID of the existing NAT instance"
  type        = string
  default     = ""
}
