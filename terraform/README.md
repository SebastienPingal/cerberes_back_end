# AWS Deployment with Terraform

This directory contains Terraform configurations to deploy the Cerberes application to AWS.

## Resources Created

- VPC with public and private subnets
- EC2 instance (t2.micro) for hosting the Node.js application
- RDS PostgreSQL database (db.t3.micro)
- Security groups and network configurations
- Elastic IP for the EC2 instance

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads.html) installed locally (v1.2.0+)
2. AWS account with appropriate permissions
3. AWS CLI configured with access credentials
4. SSH key pair created in AWS EC2

## Setup Instructions

1. Create a `terraform.tfvars` file with your specific values (use the example file as a template):
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit the `terraform.tfvars` file with your specific configuration values.

3. Initialize Terraform:
   ```bash
   terraform init
   ```

4. Plan the deployment:
   ```bash
   terraform plan
   ```

5. Apply the configuration:
   ```bash
   terraform apply
   ```

6. After successful deployment, Terraform will output the EC2 public IP and RDS endpoint.

## GitHub Actions Secrets

For the CI/CD pipeline to work, set up the following GitHub repository secrets:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_REGION`: AWS region for deployment (e.g., us-east-1)
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `SSH_KEY_NAME`: Name of the SSH key pair in AWS
- `EC2_SSH_PRIVATE_KEY`: Private SSH key content for connecting to EC2

## Cleanup

To destroy all resources created by Terraform:

```bash
terraform destroy
```

## Notes

- This setup uses the AWS free tier eligible resources
- Make sure to review security settings before using in production
- For production, consider securing the EC2 SSH access to specific IPs
- The RDS instance is created in a private subnet with access only from the application 