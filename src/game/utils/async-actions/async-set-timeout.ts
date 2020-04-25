
export const asyncSetTimeout = (delay: number, actions: Function) => (new Promise( (resolve, reject) => { 
    const t = setTimeout(() => {
        try {
            actions();
            clearTimeout(t); 
            resolve();
        } catch (error) {
            clearTimeout(t); 
            reject()
        }
    },delay) 
}));
