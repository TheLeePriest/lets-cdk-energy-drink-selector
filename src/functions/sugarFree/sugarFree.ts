type sugarEvent = {
  sugar: boolean
}

export const sugarFree = async (event: sugarEvent) => {
    const {sugar} = event;
    
    if(!sugar) {
      return {
        drinkName: 'Relentless Sugar Free'
      }
    }

    throw new Error('Sugar boolean is true, should be false');
}