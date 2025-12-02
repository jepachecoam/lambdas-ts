class Dto {
  static validateAllParameters = (params: {
    imageUrl: string;
    name: string;
    category: string;
    description: string;
  }) => {
    const missingFields: string[] = [];

    if (!params.imageUrl) missingFields.push("imageUrl");
    if (!params.name) missingFields.push("name");
    if (!params.category) missingFields.push("category");
    if (!params.description) missingFields.push("description");

    if (missingFields.length > 0) {
      return {
        isValid: false,
        missingFields
      };
    }

    // Validate imageUrl format
    try {
      const url = new URL(params.imageUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        return {
          isValid: false,
          error: "imageUrl must be a valid HTTP or HTTPS URL"
        };
      }
      if (url.hostname !== "cdn.bemaster.com") {
        return {
          isValid: false,
          error: "imageUrl must be from cdn.bemaster.com domain"
        };
      }
    } catch {
      return { isValid: false, error: "imageUrl must be a valid URL" };
    }

    // Validate string lengths
    if (params.name.trim().length < 3 || params.name.trim().length > 300) {
      return {
        isValid: false,
        error: "name must be between 3 and 200 characters"
      };
    }

    if (
      params.category.trim().length < 2 ||
      params.category.trim().length > 100
    ) {
      return {
        isValid: false,
        error: "category must be between 2 and 100 characters"
      };
    }

    if (
      params.description.trim().length < 10 ||
      params.description.trim().length > 4000
    ) {
      return {
        isValid: false,
        error: "description must be between 10 and 1000 characters"
      };
    }

    return { isValid: true, error: null };
  };
}

export default Dto;
