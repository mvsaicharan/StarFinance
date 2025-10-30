package com.virtusa.starfinance.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Table(name = "asset")
@Data
public class Asset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Enum mapping to DB: enum('8 Carat','16 Carat','24 Carat')
    @Convert(converter = AssetTypeConverter.class)
    @Column(name = "type", nullable = false)
    private AssetType type;

    @Column(precision = 38, scale = 2, nullable = false)
    private BigDecimal weight;
    private Double qualityIndex;

    private String purchasePlace;
    private String jewelerName;
    private String photoUrl;

    // Foreign Key to Customer
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    public enum AssetType {
        EIGHT_CARAT("8 Carat"),
        SIXTEEN_CARAT("16 Carat"),
        EIGHTEEN_CARAT("18 Carat"),
        TWENTY_TWO_CARAT("22 Carat"),
        TWENTY_FOUR_CARAT("24 Carat");

        private final String dbValue;

        AssetType(String dbValue) {
            this.dbValue = dbValue;
        }

        // Must exist for the converter to save the correct value
        public String getDbValue() {
            return dbValue;
        }

        // Used by the Service to instantiate the enum from frontend request (e.g., "24K")
        public static AssetType fromPurity(String purity) {
            return switch (purity) {
                case "8K" -> EIGHT_CARAT;
                case "16K" -> SIXTEEN_CARAT;
                case "18K" -> EIGHTEEN_CARAT;
                case "22K" -> TWENTY_TWO_CARAT;
                case "24K" -> TWENTY_FOUR_CARAT;
                default -> throw new IllegalArgumentException("Invalid purity: " + purity);
            };
        }

        // This would be needed by the converter for reading data back (optional for the INSERT fix)
        public static AssetType fromDbValue(String dbValue) {
            for (AssetType type : values()) {
                if (type.dbValue.equals(dbValue)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Invalid AssetType DB value: " + dbValue);
        }
    }
}