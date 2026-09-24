export type ScoreCategory = {
  label: "Baik Sekali" | "Baik" | "Cukup" | "Kurang" | "Kurang Sekali";
  color: "emerald" | "blue" | "yellow" | "orange" | "red";
  badgeBg: string;
  textColor: string;
  borderColor: string;
  gradient: string;
  description: string;
};

export function getScoreCategory(score: number): ScoreCategory {
  const s = Math.min(100, Math.max(0, Math.round(score)));
  if (s >= 90) {
    return {
      label: "Baik Sekali",
      color: "emerald",
      badgeBg: "bg-emerald-500/20",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/50",
      gradient: "from-emerald-500 to-teal-600",
      description: "Kemampuan fisik & motorik sangat baik! Responsivitas dan koordinasi gerak tubuh prima."
    };
  } else if (s >= 80) {
    return {
      label: "Baik",
      color: "blue",
      badgeBg: "bg-blue-500/20",
      textColor: "text-blue-400",
      borderColor: "border-blue-500/50",
      gradient: "from-blue-500 to-cyan-600",
      description: "Kemampuan motorik baik! Gerakan sudah konsisten dan fleksibilitas tubuh memadai."
    };
  } else if (s >= 70) {
    return {
      label: "Cukup",
      color: "yellow",
      badgeBg: "bg-yellow-500/20",
      textColor: "text-yellow-400",
      borderColor: "border-yellow-500/50",
      gradient: "from-amber-500 to-yellow-600",
      description: "Kemampuan motorik cukup. Perlu peningkatan kontinuitas gerakan dan refleks tubuh."
    };
  } else if (s >= 60) {
    return {
      label: "Kurang",
      color: "orange",
      badgeBg: "bg-orange-500/20",
      textColor: "text-orange-400",
      borderColor: "border-orange-500/50",
      gradient: "from-orange-500 to-amber-700",
      description: "Kurang lincah. Disarankan untuk latihan penguatan refleks kaki dan stamina secara bertahap."
    };
  } else {
    return {
      label: "Kurang Sekali",
      color: "red",
      badgeBg: "bg-red-500/20",
      textColor: "text-red-400",
      borderColor: "border-red-500/50",
      gradient: "from-red-500 to-rose-700",
      description: "Perlu bimbingan dan latihan dasar penguatan motorik kasar secara rutin dan berkesinambungan."
    };
  }
}

export function getGameTitle(type: string): string {
  switch (type) {
    case "endless_runner":
      return "Endless Runner";
    case "heli_runner":
      return "Heli Runner";
    case "basket_shoot":
      return "Basket Shoot";
    default:
      return type;
  }
}
