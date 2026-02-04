"use client";

import { Box, Typography, Paper } from "@mui/material";

export default function QuarterlyUpdatePage() {
    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" mb={3}>Quarterly Update</Typography>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">Quarterly update submission form will be implemented here.</Typography>
            </Paper>
        </Box>
    );
}
