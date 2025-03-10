variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"  # You can change this to your preferred region
}

variable "app_name" {
  description = "Name of the application"
  type        = string
  default     = "cerberes"
}

variable "db_username" {
  description = "Username for the RDS database"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Password for the RDS database"
  type        = string
  sensitive   = true
}

variable "ssh_key_name" {
  description = "Name of the SSH key pair to use for EC2 instances"
  type        = string
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"  # Free tier eligible
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"  # Free tier eligible
}

variable "existing_ec2_sg_id" {
  description = "ID of an existing EC2 security group to use (if empty, a new one will be created)"
  type        = string
  default     = ""
}

variable "existing_db_sg_id" {
  description = "ID of an existing security group for the RDS instance"
  type        = string
  default     = ""
}

variable "security_group_id" {
  description = "ID of the shared security group for both EC2 and RDS"
  type        = string
  default     = ""
} 