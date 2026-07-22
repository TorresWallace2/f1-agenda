import { describe, expect, it } from "vitest";
import { parseF2DriverNationalityCodes, parseOfficialF2Results } from "@/lib/data/providers/f2-provider";

describe("F2 official results provider", () => {
  it("normalizes official race results with points", () => {
    const results = parseOfficialF2Results(
      [
        {
          positionValue: "1",
          displayTime: "41:53.482",
          lapsCompleted: "18",
          racePoints: 10,
          completionStatusCode: "OK",
          driverFirstName: "Joshua",
          driverLastName: "Dürksen",
          driverTLA: "DUR",
          driverReference: "JOSDUR01",
          displayTeamName: "Invicta Racing"
        }
      ],
      8,
      "sprint",
      { JOSDUR01: "PY" }
    );

    expect(results[0]).toMatchObject({
      roundId: "f2-8",
      series: "F2",
      sessionKind: "sprint",
      position: 1,
      driverName: "Joshua Dürksen",
      driverCode: "DUR",
      nationalityCode: "PY",
      teamName: "Invicta Racing",
      laps: 18,
      time: "41:53.482",
      points: 10,
      status: "OK"
    });
  });

  it("normalizes official qualifying results without points", () => {
    const results = parseOfficialF2Results(
      [
        {
          positionNumber: "1",
          classifiedTime: "1:56.306",
          lapsCompleted: "10",
          driverFirstName: "Rafael",
          driverLastName: "Câmara",
          driverTLA: "CAM",
          driverReference: "RAFCAM01",
          constructorSeasonName: "Invicta Racing"
        }
      ],
      8,
      "qualifying",
      { RAFCAM01: "BR" }
    );

    expect(results[0]).toMatchObject({
      sessionKind: "qualifying",
      driverName: "Rafael Câmara",
      nationalityCode: "BR",
      teamName: "Invicta Racing",
      time: "1:56.306"
    });
    expect(results[0].points).toBeUndefined();
  });

  it("extracts driver nationality codes from official driver cards", () => {
    const html = `
      <div>
        <a href="/en/drivers/rafael-camara">Rafael<span>Câmara</span></a>
        <img src="https://res.cloudinary.com/prod-f2f3/common/f2/2026/invictaracing/rafcam01/2026invictaracingrafcam01numberwhitefrless.webp" />
        <svg><title>Flag of Brazil</title></svg>
      </div>
      <div>
        <a href="/en/drivers/colton-herta">Colton<span>Herta</span></a>
        <img src="https://res.cloudinary.com/prod-f2f3/common/f2/2026/hitech/colher01/2026hitechcolher01numberwhitefrless.webp" />
        <svg><title>Flag of United States of America</title></svg>
      </div>
    `;

    expect(parseF2DriverNationalityCodes(html)).toEqual({
      RAFCAM01: "BR",
      COLHER01: "US"
    });
  });
});
