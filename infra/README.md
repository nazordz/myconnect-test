# Infrastructure

Terraform stack for this NestJS service on AWS:

- VPC across two Availability Zones
- Public Application Load Balancer
- ECS Fargate service
- ECR repository for the app image
- Private RDS PostgreSQL instance
- Secrets Manager values for `DATABASE_URL` and `OPENAI_API_KEY`
- CloudWatch logs, IAM roles, and security groups

The ECS service is configured for a container listening on port `3000`, matching `src/main.ts`.

## Prerequisites

- Terraform `>= 1.6`
- AWS CLI authenticated to the target account
- Docker, for building and pushing the app image

## Plan

Use a shell environment variable for the OpenAI key so it is not written to `terraform.tfvars`:

```sh
cd infra
terraform init
export TF_VAR_openai_api_key="sk-..."
terraform plan -out=tfplan
```

Optional variables can be passed with `-var`, for example:

```sh
terraform plan -out=tfplan \
  -var='aws_region=ap-southeast-1' \
  -var='environment=dev' \
  -var='image_tag=latest'
```

## First Deploy Procedure

Terraform creates the ECR repository, but it does not build or push the Docker image. For the first deploy:

1. Create the ECR repository first:

   ```sh
   cd infra
   terraform init
   export TF_VAR_openai_api_key="sk-..."
   terraform apply -target=aws_ecr_repository.app
   ```

2. Push the image:

   ```sh
   AWS_REGION="$(terraform output -raw ecr_repository_url | cut -d. -f4)"
   ECR_REPO="$(terraform output -raw ecr_repository_url)"
   AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

   aws ecr get-login-password --region "$AWS_REGION" \
     | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

   cd ..
   docker build -t myconnect-test:latest .
   docker tag myconnect-test:latest "$ECR_REPO:latest"
   docker push "$ECR_REPO:latest"
   ```

3. Plan and apply the full stack:

   ```sh
   cd infra
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

4. Read the app URL:

   ```sh
   terraform output app_url
   ```

## Database Migrations

The RDS database is private and only accepts traffic from the ECS task security group. Run Prisma migrations from inside AWS, such as a one-off ECS task using an image that includes the Prisma CLI:

```sh
pnpm exec prisma migrate deploy
```

The current production image must also start the NestJS app on port `3000`; for example, `node dist/main`.
