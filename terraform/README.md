# AWS Deployment with Terraform

This directory contains Terraform configurations to deploy the Cerberes application to AWS.

## ��️ Resources Created (Free Tier Compatible)

- VPC with public and private subnets (free)
- EC2 t2.micro instance for hosting the Node.js application (free tier eligible - 750 hours/month)
- RDS PostgreSQL db.t3.micro database (free tier eligible - 750 hours/month)
- Security groups and network configurations (free)
- Auto-assigned public IP (free) instead of Elastic IP

## 💰 AWS Free Tier Considerations

This deployment is designed to stay within AWS Free Tier limits:

- **EC2**: t2.micro instance (free for 12 months, 750 hours/month)
- **RDS**: db.t3.micro with 10GB storage (free for 12 months, 750 hours/month)
- **Storage**: Total 10GB for RDS (free tier includes 20GB total)
- **Data Transfer**: Keep in mind the 1GB/month free outbound data limit

**Important**: Free tier is only available for 12 months from AWS account creation.

## 📋 Prerequisites

1. [Terraform](https://www.terraform.io/downloads.html) installed locally (v1.2.0+)
2. AWS account with appropriate permissions
3. AWS CLI configured with access credentials
4. SSH key pair created in AWS EC2

## 🚀 Setup Instructions

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

## 🔑 GitHub Actions Secrets

For the CI/CD pipeline to work, set up the following GitHub repository secrets:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_REGION`: AWS region for deployment (e.g., eu-west-1)
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `SSH_KEY_NAME`: Name of the SSH key pair in AWS
- `EC2_SSH_PRIVATE_KEY`: Private SSH key content for connecting to EC2

## 🧹 Handling Existing Resources

The deployment is designed to handle existing resources:

1. **Importing Resources**: The CI/CD pipeline will automatically check for existing resources and import them into the Terraform state.

2. **Lifecycle Rules**: Resources have lifecycle rules to prevent unnecessary recreation:
   - `create_before_destroy`: For security groups
   - `ignore_changes`: For specific attributes that shouldn't trigger recreation
   - `prevent_destroy`: Can be enabled for critical resources in production

3. **Manual Import**: If needed, you can manually import resources:
   ```bash
   terraform import aws_db_subnet_group.db_subnet_group cerberes-db-subnet-group
   terraform import aws_db_instance.postgres cerberes-db
   ```

## 🔄 State Management

For production use, it's recommended to use remote state storage:

1. Create an S3 bucket and DynamoDB table for state locking:
   ```bash
   aws s3 mb s3://cerberes-terraform-state
   aws dynamodb create-table \
     --table-name cerberes-terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```

2. Uncomment and configure the backend block in `main.tf`:
   ```hcl
   backend "s3" {
     bucket         = "cerberes-terraform-state"
     key            = "terraform.tfstate"
     region         = "eu-west-1"
     encrypt        = true
     dynamodb_table = "cerberes-terraform-locks"
   }
   ```

3. Re-initialize Terraform:
   ```bash
   terraform init
   ```

## ⚠️ Cost Management

To avoid unexpected charges:

1. **Monitor Usage**: Regularly check the AWS Billing dashboard
2. **Set Budgets**: Create AWS budget alerts to notify you of spending
3. **Cleanup**: When not in use, consider destroying resources with `terraform destroy`
4. **Data Transfer**: Be mindful of outbound data transfer (>1GB/month incurs charges)

## 🧪 Troubleshooting

Common issues and solutions:

1. **Resource Already Exists**: 
   - Check if the resource exists in AWS but not in Terraform state
   - Import the resource using `terraform import`
   - Use the lifecycle rules to manage changes

2. **Permission Errors**:
   - Verify IAM permissions for your AWS credentials
   - Ensure the user has necessary permissions for all resources

3. **SSH Connection Issues**:
   - Verify the SSH key pair exists in AWS
   - Check that the private key content in GitHub secrets is correct
   - Ensure security group allows SSH access

## ♻️ Cleanup

To destroy all resources created by Terraform:

```bash
terraform destroy
```

For selective cleanup, you can target specific resources:

```bash
terraform destroy -target=aws_db_instance.postgres
```

## 📝 Notes

- This setup uses AWS free tier eligible resources
- For production, enable `prevent_destroy` for critical resources
- Consider securing the EC2 SSH access to specific IPs
- The RDS instance is created in a private subnet with access only from the application 