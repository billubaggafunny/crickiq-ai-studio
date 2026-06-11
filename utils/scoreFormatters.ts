export const formatScore = (runs: number | undefined, wickets: number | undefined): string => {
    return `${runs ?? 0}/${wickets ?? 0}`;
};

export const formatOvers = (overs: string | number | undefined): string => {
    return `${overs ?? "0.0"} ov`;
};

export const formatRunRate = (rate: string | number | undefined): string => {
    const formattedRate = typeof rate === 'number' ? rate.toFixed(2) : (rate || "0.00");
    return `RR ${formattedRate}`;
};

export const formatRequiredRate = (rate: string | number | undefined): string => {
    const formattedRate = typeof rate === 'number' ? rate.toFixed(2) : (rate || "0.00");
    return `REQ ${formattedRate}`;
};

export const formatTarget = (target: number | undefined): string => {
    return target !== undefined ? `Target ${target}` : "Target -";
};
