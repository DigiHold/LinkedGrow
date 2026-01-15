import {
  FooterVariant1,
  FooterVariant2,
  FooterVariant3,
  FooterVariant4,
  FooterVariant5,
} from "@/components/marketing/footer";

export default function FooterPreviewPage() {
  return (
    <div className="min-h-screen">
      {/* Variant 1 */}
      <div className="border-b-8 border-red-500">
        <div className="bg-red-500 text-white text-center py-4 text-2xl font-bold sticky top-0 z-50">
          VARIANT 1 - Newsletter Banner
        </div>
        <FooterVariant1 />
      </div>

      {/* Variant 2 */}
      <div className="border-b-8 border-blue-500">
        <div className="bg-blue-500 text-white text-center py-4 text-2xl font-bold sticky top-0 z-50">
          VARIANT 2 - Minimal Centered
        </div>
        <FooterVariant2 />
      </div>

      {/* Variant 3 */}
      <div className="border-b-8 border-green-500">
        <div className="bg-green-500 text-white text-center py-4 text-2xl font-bold sticky top-0 z-50">
          VARIANT 3 - Dark Gradient
        </div>
        <FooterVariant3 />
      </div>

      {/* Variant 4 */}
      <div className="border-b-8 border-purple-500">
        <div className="bg-purple-500 text-white text-center py-4 text-2xl font-bold sticky top-0 z-50">
          VARIANT 4 - Card Style
        </div>
        <FooterVariant4 />
      </div>

      {/* Variant 5 */}
      <div>
        <div className="bg-orange-500 text-white text-center py-4 text-2xl font-bold sticky top-0 z-50">
          VARIANT 5 - Split Layout
        </div>
        <FooterVariant5 />
      </div>
    </div>
  );
}
