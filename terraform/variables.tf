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