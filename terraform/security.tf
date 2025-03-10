# Security group for the application
resource "aws_security_group" "app_sg" {
  # Only create if no security group ID is provided
  count       = var.security_group_id == "" ? 1 : 0
  name        = "${var.app_name}-sg"
  description = "Security group for ${var.app_name} application"
  vpc_id      = local.vpc_id

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }

  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  # Application port access
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Application port access"
  }

  # PostgreSQL access within the security group
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    self        = true
    description = "PostgreSQL access within the security group"
  }

  # Outbound internet access
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Outbound internet access"
  }

  tags = {
    Name = "${var.app_name}-sg"
  }
}

# Local variable for security group ID
locals {
  # Use the provided security group ID if available, otherwise use the created one
  security_group_id = var.security_group_id != "" ? var.security_group_id : (length(aws_security_group.app_sg) > 0 ? aws_security_group.app_sg[0].id : null)
} 