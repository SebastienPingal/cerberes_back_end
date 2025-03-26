# Data source for existing DB subnet group
data "aws_db_subnet_group" "existing" {
  count = var.db_subnet_group_exists ? 1 : 0  # Only look if we're using an existing subnet group
  name  = "${var.app_name}-db-subnet-group"
}

# Local variables for RDS
locals {
  # DB subnet group name - use the existing one if it exists, otherwise create new
  db_subnet_group_name = var.db_subnet_group_exists ? data.aws_db_subnet_group.existing[0].name : "${var.app_name}-db-subnet-group"
  
  # Check if DB instance exists
  db_instance_exists = length(data.aws_db_instances.existing.instance_identifiers) > 0
}

# Check for existing RDS instance
data "aws_db_instances" "existing" {
  filter {
    name   = "db-instance-id"
    values = ["${var.app_name}-db"]
  }
}

# RDS PostgreSQL instance - only create if no instance exists
resource "aws_db_instance" "postgres" {
  count                = local.db_instance_exists ? 0 : 1
  identifier           = "${var.app_name}-db"
  engine               = "postgres"
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