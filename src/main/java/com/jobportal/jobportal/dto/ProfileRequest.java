package com.jobportal.jobportal.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class ProfileRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$",
            message = "Phone must be 10 to 15 digits (optional + at the start)")
    private String phone;

    @NotBlank(message = "College name is required")
    @Size(max = 180, message = "College name must be at most 180 characters")
    private String collegeName;

    @NotBlank(message = "Degree is required")
    @Size(max = 120, message = "Degree must be at most 120 characters")
    private String degree;

    @NotBlank(message = "Branch is required")
    @Size(max = 120, message = "Branch must be at most 120 characters")
    private String branch;

    @NotNull(message = "Graduation year is required")
    @Min(value = 1950, message = "Enter a valid graduation year")
    @Max(value = 2100, message = "Enter a valid graduation year")
    private Integer graduationYear;

    @DecimalMin(value = "0.0", message = "CGPA must be between 0 and 10")
    @DecimalMax(value = "10.0", message = "CGPA must be between 0 and 10")
    @Digits(integer = 2, fraction = 2, message = "CGPA can have at most 2 decimal places")
    private BigDecimal cgpa;

    @NotBlank(message = "Skills are required")
    @Size(max = 2000, message = "Skills must be at most 2000 characters")
    private String skills;

    @Size(max = 255, message = "LinkedIn URL must be at most 255 characters")
    @Pattern(regexp = "^$|^https?://\\S+$",
            message = "LinkedIn URL must start with http:// or https://")
    private String linkedinUrl;

    @Size(max = 255, message = "GitHub URL must be at most 255 characters")
    @Pattern(regexp = "^$|^https?://\\S+$",
            message = "GitHub URL must start with http:// or https://")
    private String githubUrl;

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCollegeName() {
        return collegeName;
    }

    public void setCollegeName(String collegeName) {
        this.collegeName = collegeName;
    }

    public String getDegree() {
        return degree;
    }

    public void setDegree(String degree) {
        this.degree = degree;
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public Integer getGraduationYear() {
        return graduationYear;
    }

    public void setGraduationYear(Integer graduationYear) {
        this.graduationYear = graduationYear;
    }

    public BigDecimal getCgpa() {
        return cgpa;
    }

    public void setCgpa(BigDecimal cgpa) {
        this.cgpa = cgpa;
    }

    public String getSkills() {
        return skills;
    }

    public void setSkills(String skills) {
        this.skills = skills;
    }

    public String getLinkedinUrl() {
        return linkedinUrl;
    }

    public void setLinkedinUrl(String linkedinUrl) {
        this.linkedinUrl = linkedinUrl;
    }

    public String getGithubUrl() {
        return githubUrl;
    }

    public void setGithubUrl(String githubUrl) {
        this.githubUrl = githubUrl;
    }
}
