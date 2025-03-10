# Look for existing DB security group
data "aws_security_group" "db_existing" {
  count = 0  # This will be set to 1 by the workflow if we want to use existing security groups
  
  filter {
    name   = "group-name"
    values = ["${var.app_name}-db-sg"]
  }
  
  filter {
    name   = "vpc-id"
    values = [local.vpc_id]
  }
}

# Look for existing RDS security group
data "aws_security_group" "db_sg" {
  name   = "${var.app_name}-db-sg"
  vpc_id = local.vpc_id
}

# Use an existing DB subnet group if it exists
# This is handled in the workflow by checking for existing resources
data "aws_db_subnet_group" "existing" {
  name = "${var.app_name}-db-subnet-group"
  count = 0  # This is set to 0 by default, but the workflow will modify this file if the subnet group exists
}

# DB Subnet Group - only created if it doesn't already exist
resource "aws_db_subnet_group" "db_subnet_group" {
  # Only create if the data lookup doesn't find an existing one and we have private subnets
  count      = length(data.aws_db_subnet_group.existing) > 0 ? 0 : (length(local.private_subnet_ids) >= 2 ? 1 : 0)
  name       = "${var.app_name}-db-subnet-group"
  subnet_ids = local.private_subnet_ids

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

# Local variables for RDS
locals {
  create_db_instance = length(data.aws_db_instance.existing) == 0
  
  # Get the DB endpoint safely
  db_endpoint = length(data.aws_db_instance.existing) > 0 ? data.aws_db_instance.existing[0].endpoint : (length(aws_db_instance.postgres) > 0 ? aws_db_instance.postgres[0].endpoint : "no-endpoint-available")
  
  # Get the private subnet IDs to use
  private_subnet_ids = length(data.aws_subnets.private) > 0 && length(data.aws_subnets.private[0].ids) >= 2 ? [data.aws_subnets.private[0].ids[0], data.aws_subnets.private[0].ids[1]] : (length(aws_subnet.private_subnet_1) > 0 && length(aws_subnet.private_subnet_2) > 0 ? [aws_subnet.private_subnet_1[0].id, aws_subnet.private_subnet_2[0].id] : [])
}

# RDS PostgreSQL instance
resource "aws_db_instance" "postgres" {
  # Only create if the data lookup doesn't find an existing one
  count                  = local.create_db_instance ? 1 : 0
  identifier             = "${var.app_name}-db"
  engine                 = "postgres"
  instance_class         = var.db_instance_class
  allocated_storage      = 10
  storage_type           = "gp2"
  db_name                = "cerberes"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.db_subnet_group[0].name
  vpc_security_group_ids = [data.aws_security_group.db_sg.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  backup_retention_period = 1
  
  multi_az               = false
  performance_insights_enabled = false
  
  tags = {
    Name = "${var.app_name}-db"
  }
}

# Output the DB endpoint - using the local variable for safety
output "db_endpoint" {
  description = "Database endpoint"
  value       = local.db_endpoint
} 