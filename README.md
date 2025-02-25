# Lambda Project Documentation

This documentation provides a comprehensive guide for setting up, building, and working with Lambda projects. It includes instructions for building the Lambda function and configuring your Visual Studio Code (VSCode) environment.

---

## Table of Contents

1. [Building the Lambda Function](#building-the-lambda-function)
2. [Setting Up Visual Studio Code (VSCode)](#setting-up-visual-studio-code-vscode)
3. [Additional Notes](#additional-notes)

---

## Building the Lambda Function

To build your Lambda function, follow these steps:

1. Open a terminal in the root directory of your project.
2. Run the following command:
   ```bash
   ./build-lambda.sh
   ```
3. When prompted, enter the name of the folder containing your source code.

## This script will compile and package your Lambda function for deployment. Note that the package will **not include dependencies** from the `node_modules` directory. Instead, you should use **Lambda Layers** to manage and include your dependencies separately. This approach ensures a cleaner deployment and better dependency management.

## Setting Up Visual Studio Code (VSCode)

To ensure a consistent and efficient development environment, you can import a predefined VSCode profile. This profile includes all the necessary extensions and settings for working with Lambda projects.

### Steps to Import the VSCode Profile

1. Open Visual Studio Code.
2. Navigate to the **Command Palette**:
   - Windows/Linux: Press `Ctrl+Shift+P`
   - Mac: Press `Cmd+Shift+P`
3. Search for and select **"Preferences: Import Profile"**.
4. Choose the file located at `.vsc/BeMaster.code-profile` in your project directory.
5. Follow the prompts to complete the import process.

Once imported, your VSCode environment will be configured with all the required extensions and settings for Lambda development.

---

## Additional Notes

- Ensure you have the necessary permissions to execute the `build-lambda.sh` script. If needed, run:
  ```bash
  chmod +x build-lambda.sh
  ```
