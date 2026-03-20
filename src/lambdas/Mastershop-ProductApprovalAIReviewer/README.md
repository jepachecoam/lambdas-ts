# Mastershop-ProductApprovalAIReviewer

## Purpose

This lambda performs AI-powered product approval reviews for the Mastershop marketplace. Its sole responsibility is to analyze product submissions (image, name, description, and category) and return an automated approval decision or flag the product for manual review based on platform policies. It contains no business logic beyond content moderation decisions.

## What it does

It receives a product submission containing an image URL, product name, description, and declared category. It uses an AI model to analyze the image content, validates the name and description for policy compliance, and suggests an alternative category if the declared one doesn't match the visual content. The lambda returns structured validation results indicating whether the product is approved, rejected, or requires manual review, along with specific flags for prohibited content, weight concerns, dimension concerns, or category mismatches.

## Review flow

1. Validates that all required fields (image URL, name, description, category) are present and properly formatted.
2. Downloads the product image from the provided URL.
3. Invokes an AI vision model to analyze the image content, extracting a description and detecting prohibited content, visible weight labels, and dimension indicators.
4. If prohibited content is detected, immediately returns a rejection without further analysis.
5. Invokes an AI language model to analyze the product name against the image description, checking for semantic relevance and detecting prohibited terms or concerning dimensions.
6. If the name raises concerns, immediately returns flags without further analysis.
7. Invokes an AI language model to analyze the product description against the image content, checking semantic relevance and detecting prohibited terms or concerning dimensions.
8. If the description raises concerns, immediately returns flags without further analysis.
9. Invokes an AI language model to evaluate whether the declared category matches the visual content, suggesting an alternative category if the match is weak.
10. Returns a consolidated response with validation results and category suggestions.

## Context produced on success

When a product review completes, the system produces:

- Validation flags for each field (image, name, description) indicating any concerns.
- A flag for prohibited content if detected in any field.
- A flag for weight concerns if a weight exceeding one kilogram is detected.
- A flag for dimension concerns if large measurements are visible.
- A suggested category if the declared category doesn't match the visual content.

## Internal layers

- **index**: entry point. Validates input parameters, orchestrates the review flow, and builds the HTTP response.
- **model**: holds all review logic — sequential validation of each field, rule application, and response composition.
- **dao**: external integration layer. Handles image downloading and invokes AI models for image and text analysis.
- **dto**: handles data transformation. Validates input formats and structures the output for response delivery.
- **types**: defines internal constants and result types for validation outcomes.
- **prompts**: internal prompt templates for AI model interactions.
