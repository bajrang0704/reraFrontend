import MainLayout from "@/components/layout/MainLayout";

export default function UpdateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <MainLayout>
            {children}
        </MainLayout>
    );
}
