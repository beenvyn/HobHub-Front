import { http } from './http';

export const addHobby = async (
    category: string,
    hobby: string,
    percent: number,
) => {
    try {
        const res = await http.post(`/user/${6}/hobby`, {
            hobby: hobby,
            category: category,
            percent: percent,
        });
        console.log(res);
        return res;
    } catch (error) {
        console.log(error);
    }
};
