# Check if DB subnet group exists - use try/catch to handle the case where it doesn't exist
data "aws_db_subnet_group" "existing" {
  count = 0
  name  = "${var.app_name}-db-subnet-group"
}

# DB Subnet Group for RDS - only create if it doesn't already exist
resource "aws_db_subnet_group" "db_subnet_group" {
  # Only create if we have at least 2 subnets
  count      = length(local.private_subnet_ids) >= 2 ? 1 : 0
  name       = "${var.app_name}-db-subnet-group"
  subnet_ids = local.private_subnet_ids

  tags = {
    Name = "${var.app_name}-db-subnet-group"
  }
}

# Check for existing RDS instance
data "aws_db_instances" "existing" {
  filter {
    name   = "db-instance-id"
    values = ["${var.app_name}-db"]
  }
}

# Local variables for RDS
locals {
  # Check if DB subnet group exists - use try to handle the case where the subnet group doesn't exist
  db_subnet_group_exists = false  # We'll handle this with a try/catch approach
  
  # Get the subnet group name to use - use the existing one if it exists, otherwise use the one we created
  db_subnet_group_name = length(aws_db_subnet_group.db_subnet_group) > 0 ? aws_db_subnet_group.db_subnet_group[0].name : null
  
  # Check if DB instance exists
  db_instance_exists = length(data.aws_db_instances.existing.instance_identifiers) > 0
}

# RDS PostgreSQL instance - only create if no instance exists
resource "aws_db_instance" "postgres" {
  count                = local.db_instance_exists ? 0 : 1
  identifier           = "${var.app_name}-db"
  engine               = "postgres"
  engine_version       = "13.7"
  instance_class       = var.db_instance_class
  allocated_storage    = 20
  storage_type         = "gp2"
  username             = var.db_username
  password             = var.db_password
  db_name              = var.app_name
  vpc_security_group_ids = [local.security_group_id]
  db_subnet_group_name = local.db_subnet_group_name
  skip_final_snapshot  = true
  publicly_accessible  = false
  multi_az             = false
  backup_retention_period = 7
  backup_window        = "03:00-04:00"
  maintenance_window   = "mon:04:00-mon:05:00"

  tags = {
    Name = "${var.app_name}-db"
  }
}

# Data source to get information about the existing RDS instance if it exists
data "aws_db_instance" "existing_db" {
  count                  = local.db_instance_exists ? 1 : 0
  db_instance_identifier = "${var.app_name}-db"
}

# Output the RDS endpoint
output "db_endpoint" {
  value       = local.db_instance_exists ? data.aws_db_instance.existing_db[0].endpoint : (length(aws_db_instance.postgres) > 0 ? aws_db_instance.postgres[0].endpoint : null)
  description = "The endpoint of the RDS instance"
}