package com.jobportal.jobportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CompanyRequest {

    @NotBlank(message = "Company name is required")
    @Size(max = 180, message = "Company name must be at most 180 characters")
    private String name;

    @Size(max = 255, message = "Website must be at most 255 characters")
    @Pattern(regexp = "^$|^https?://\\S+$",
            message = "Website must start with http:// or https://")
    private String website;

    @Size(max = 120, message = "Industry must be at most 120 characters")
    private String industry;

    @Size(max = 60, message = "Company size must be at most 60 characters")
    private String companySize;

    @Size(max = 5000, message = "Description must be at most 5000 characters")
    private String description;

    @Size(max = 150, message = "Headquarters must be at most 150 characters")
    private String headquarters;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getCompanySize() {
        return companySize;
    }

    public void setCompanySize(String companySize) {
        this.companySize = companySize;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getHeadquarters() {
        return headquarters;
    }

    public void setHeadquarters(String headquarters) {
        this.headquarters = headquarters;
    }
}
