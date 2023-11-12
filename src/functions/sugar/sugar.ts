type sugarEvent = {
  sugar: boolean
}

export const sugar = async (event: sugarEvent) => {
    const {sugar} = event;
    
    if(sugar) {
      return {
        drinkName: 'Relentless'
      }
    }

    throw new Error('Sugar boolean is false, should be true');
}