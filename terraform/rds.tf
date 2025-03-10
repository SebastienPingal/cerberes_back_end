# Security group for RDS
resource "aws_security_group" "db_sg" {
  name        = "${var.app_name}-db-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.app_vpc.id

  # PostgreSQL access from EC2 security group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-db-sg"
  }

  # Allow replacement of security group if it exists
  lifecycle {
    create_before_destroy = true
  }
}

# Use an existing DB subnet group if it exists
# This is handled in the workflow by checking for existing resources
data "aws_db_subnet_group" "existing" {
  name = "${var.app_name}-db-subnet-group"
  count = 0  # This is set to 0 by default, but the workflow will modify this file if the subnet group exists
}

# DB Subnet Group - only created if it doesn't already exist
resource "aws_db_subnet_group" "db_subnet_group" {
  # Only create if the data lookup doesn't find an existing one
  count      = length(data.aws_db_subnet_group.existing) > 0 ? 0 : 1
  name       = "${var.app_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]

  tags = {
    Name = "${var.app_name}-db-subnet-group"
  }
}

# Use existing RDS instance if it exists
# This is handled in the workflow by checking for existing resources
data "aws_db_instance" "existing" {
  db_instance_identifier = "${var.app_name}-db"
  count = 0  # This is set to 0 by default, but the workflow will modify this file if the instance exists
}

# RDS PostgreSQL instance - only created if it doesn't already exist
resource "aws_db_instance" "postgres" {
  # Only create if the data lookup doesn't find an existing one
  count                  = length(data.aws_db_instance.existing) > 0 ? 0 : 1
  identifier             = "${var.app_name}-db"
  engine                 = "postgres"
  # Let AWS choose the default version by not specifying engine_version
  instance_class         = var.db_instance_class
  allocated_storage      = 10      # Reduced to 10GB to stay well within free tier
  storage_type           = "gp2"
  db_name                = "cerberes"
  username               = var.db_username
  password               = var.db_password
  # Use the existing subnet group if available, otherwise use the new one
  db_subnet_group_name   = length(data.aws_db_subnet_group.existing) > 0 ? data.aws_db_subnet_group.existing[0].name : aws_db_subnet_group.db_subnet_group[0].name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  backup_retention_period = 1      # Reduced to 1 day to minimize storage usage
  
  # Free tier optimizations
  multi_az               = false   # Multi-AZ is not free tier eligible
  performance_insights_enabled = false # Performance Insights is not free tier eligible
  
  tags = {
    Name = "${var.app_name}-db"
  }

  # Prevent recreation if certain attributes change
  lifecycle {
    ignore_changes = [
      snapshot_identifier,
      password,   # Allow password updates without recreation
      engine_version # Allow version updates without recreation
    ]
  }
}

# Output the DB endpoint - handles both new and existing instances
output "db_endpoint" {
  description = "Database endpoint"
  value       = length(data.aws_db_instance.existing) > 0 ? data.aws_db_instance.existing[0].endpoint : length(aws_db_instance.postgres) > 0 ? aws_db_instance.postgres[0].endpoint : "no-endpoint-available"
} 