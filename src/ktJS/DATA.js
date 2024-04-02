export const DATA = {
  pipelineMap: [
    { name: 'part1ToCrudeOilStation', path: [21, 3, 22, 23, 4, 5, 11] },
    { name: 'part1ToFinishedOilStation', path: [21, 3, 22, 23, 4, 5, 20, 9, 13] },
    { name: 'crudeOilStationToStorage1', path: [11, 20, 6, 7, 15] },
    { name: 'crudeOilStationToStorage2', path: [11, 20, 6, 7, 25, 16] }
  ],
  mapReversePipelineList: [11, 13, 15, 16]
  // 4, 23, 3, 22, 21
}

window.DATA = DATA