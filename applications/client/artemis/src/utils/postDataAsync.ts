const postDataAsync = async (url: string, dataToPost: any, parseJson: boolean = true) => {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dataToPost),
        });

        if (parseJson) {
            return await res.json();
        }       
        return res;
    } catch (error) {
        console.log(error);
        
        console.log(`Error: ${url} failed to send`);
    }
};

export { postDataAsync };
