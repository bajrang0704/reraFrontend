"use client";

import { Box, Typography, Paper } from "@mui/material";

export default function CompletionCertificatePage() {
    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" mb={3}>Overall Completion Certificate Upload</Typography>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">Completion Certificate upload form will be implemented here.</Typography>
            </Paper>
        </Box>
    );
}
