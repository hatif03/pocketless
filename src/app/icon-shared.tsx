const BRAND_GREEN = "#16A34A";

export function brandMark(padding: number) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_GREEN,
        padding,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          border: "6px solid white",
          color: "white",
          fontSize: 96,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        P
      </div>
    </div>
  );
}
