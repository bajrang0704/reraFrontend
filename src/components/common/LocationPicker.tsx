"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    CircularProgress,
    InputAdornment,
    IconButton,
    Typography
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const MapSelector = dynamic(() => import("./MapSelector"), {
    ssr: false,
    loading: () => <Box height={400} display="flex" alignItems="center" justifyContent="center"><CircularProgress /></Box>
});

interface LocationPickerProps {
    open: boolean;
    onClose: () => void;
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
}

export default function LocationPicker({ open, onClose, onLocationSelect, initialLat, initialLng }: LocationPickerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
    const [selectedPosition, setSelectedPosition] = useState<{ lat: number, lng: number } | null>(null);

    // Sync initial position when modal opens
    useEffect(() => {
        if (open && initialLat && initialLng) {
            setSelectedPosition({ lat: initialLat, lng: initialLng });
            setMapCenter([initialLat, initialLng]);
        } else if (open && !initialLat) {
            // Reset if opening new
            setSelectedPosition(null);
        }
    }, [open, initialLat, initialLng]);

    const handleSearch = async () => {
        if (!searchQuery) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setMapCenter([lat, lon]);
            }
        } catch (error) {
            console.error("Search failed", error);
        }
    };

    const handleConfirm = () => {
        if (selectedPosition) {
            onLocationSelect(selectedPosition.lat, selectedPosition.lng);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Select Location</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2, mt: 1, display: "flex", gap: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search location (e.g. Hyderabad)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleSearch}>
                                        <SearchIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button variant="outlined" onClick={handleSearch}>Search</Button>
                </Box>

                <Box mb={2}>
                    <Typography variant="caption" color="textSecondary">
                        Click on the map to set the project location marker.
                    </Typography>
                </Box>

                <MapSelector
                    lat={selectedPosition?.lat}
                    lng={selectedPosition?.lng}
                    onSelect={(lat, lng) => setSelectedPosition({ lat, lng })}
                    center={mapCenter}
                />

                {selectedPosition && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                        <Typography variant="body2">
                            <strong>Selected Coordinates:</strong> {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleConfirm} variant="contained" disabled={!selectedPosition}>
                    Confirm Location
                </Button>
            </DialogActions>
        </Dialog>
    );
}
