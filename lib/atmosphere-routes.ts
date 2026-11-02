/**
 * 夜雨是同一套 RainField。首页和 /dafeiyu 挂上；别的页不挂。
 * 闪电只留首页，不跟去实验室页。
 */
export function atmosphereForPath(pathname: string): { rain: boolean; lightning: boolean } {
  const home = pathname === "/";
  return {
    rain: home || pathname === "/dafeiyu",
    lightning: home,
  };
}
