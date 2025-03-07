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
}

# DB Subnet Group
resource "aws_db_subnet_group" "db_subnet_group" {
  name       = "${var.app_name}-db-subnet-group-new"
  subnet_ids = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]

  tags = {
    Name = "${var.app_name}-db-subnet-group-new"
  }
}

# RDS PostgreSQL instance
resource "aws_db_instance" "postgres" {
  identifier             = "${var.app_name}-db"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  storage_type           = "gp2"
  db_name                = "cerberes"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  backup_retention_period = 7
  
  tags = {
    Name = "${var.app_name}-db"
  }
}

output "db_endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.postgres.endpoint
} 