// V:\Virtusa Capstone Project\starfinance\src\main\java\com\virtusa\starfinance\entity\AssetTypeConverter.java

package com.virtusa.starfinance.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class AssetTypeConverter implements AttributeConverter<Asset.AssetType, String> {

    @Override
    public String convertToDatabaseColumn(Asset.AssetType attribute) {
        if (attribute == null) {
            return null;
        }
        // Sends the DB string value (e.g., '24 Carat') to the database
        return attribute.getDbValue();
    }

    @Override
    public Asset.AssetType convertToEntityAttribute(String dbData) {
        // ... (implementation for reading data back)
        // This part is less critical for the INSERT error but ensures reads work
        return Asset.AssetType.fromDbValue(dbData);
    }
}