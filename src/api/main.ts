import { http } from './http';

// 사용자 맞춤형 메인 화면 게시글 가져오기(나이)
export const getAgeMainBoard = async ({ age }: { age: number }) => {
    try {
        const res = await http.get(`/board/age/${age}`);
        console.log(res);
        return res;
    } catch (error) {
        console.log(error);
    }
};

// 사용자 맞춤형 메인 화면 게시글 가져오기(성별)
export const getGenderMainBoard = async ({ gender }: { gender: string }) => {
    try {
        const res = await http.get(`/board/gender/${gender}`);
        console.log(res);
        return res;
    } catch (error) {
        console.log(error);
    }
};

// 사용자 맞춤형 메인 화면 게시글 가져오기(지역)
export const getLocationMainBoard = async ({ home }: { home: string }) => {
    try {
        const res = await http.get(`/board/home/${home}`);
        console.log(res);
        return res;
    } catch (error) {
        console.log(error);
    }
};

// 사용자 맞춤형 메인 화면 게시글 가져오기(목적)
export const getMotiveMainBoard = async ({ motive }: { motive: string }) => {
    try {
        const res = await http.get(`/board/motive/${motive}`);
        console.log(res);
        return res;
    } catch (error) {
        console.log(error);
    }
};

// 사용자 맞춤형 메인 화면 게시글 가져오기(소득)
export const getIncomeMainBoard = async ({ income }: { income: string }) => {
    try {
        const res = await http.get(`/board/motive/${income}`);
        console.log(res);
        return res;
    } catch (error) {
        console.log(error);
    }
};
