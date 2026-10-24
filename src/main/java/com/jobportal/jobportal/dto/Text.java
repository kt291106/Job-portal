package com.jobportal.jobportal.dto;

public final class Text {

    private Text() {
    }

    /** Trims the value and turns blank strings into null. */
    public static String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
