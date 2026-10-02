/**
 * Ambientno ozadje zaslonov prijave — trije veliki, močno zamegljeni madeži.
 *
 * Obstaja zato, ker je prijava na ravni ploskvi videti kot obrazec brez strani
 * okoli sebe. Madeži dajo globino, ne da bi karkoli kričali.
 *
 * Barve gredo skozi žetone, zato se same prilagodijo temi. Brez dogodkov in
 * brez pomena za bralnike zaslona.
 */
export function AuthOzadje() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="from-poudarek/20 absolute -top-40 -left-40 size-[40rem] rounded-full bg-radial from-0% to-transparent to-65% blur-[100px]" />
      <div className="from-poudarek/12 absolute top-1/3 -right-32 size-[35rem] rounded-full bg-radial from-0% to-transparent to-65% blur-[110px]" />
      <div className="from-crta/60 absolute -bottom-40 left-1/4 size-[42rem] rounded-full bg-radial from-0% to-transparent to-65% blur-[120px]" />
    </div>
  );
}
