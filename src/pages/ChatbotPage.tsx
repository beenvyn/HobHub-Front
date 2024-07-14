import styled from 'styled-components';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

// components
import Navbar from 'components/_common/Navbar';
import { ImgStyle } from 'components/_common/commonStyle';
import { collabHobbyIcons } from 'components/_common/icons';
import { UserDetail } from 'components/_common/props';

// assets
import arrow from '../assets/_common/arrow-up.svg';
import bot from '../assets/_common/defaultProfile.png';

// recoil
import { UserDetailAtom } from 'recoil/UserDetail';
import { RecommendAtom } from 'recoil/Recommend';
import { LoginAtom } from 'recoil/Login';
import { UserAtom } from 'recoil/User';
import { UserDetailAvailableAtom } from 'recoil/UserDetail';

// api
import { http } from 'flask_api/http';
import { saveUserInfo } from 'api/user';

const history = Array.from({ length: 30 }, (_, index) => ({
    order: index,
    text: '',
}));
const buttonHistory = Array.from({ length: 30 }, (_, index) => ({
    order: index,
    buttons: [],
}));

const ChatbotPage = () => {
    const [userDetail, setUserDetail] = useRecoilState(UserDetailAtom); // 사용자 정보 recoil 저장
    const [recommend, setRecommend] = useRecoilState(RecommendAtom); // 추천 취미 recoil 저장
    const [userId, setUserId] = useRecoilState(UserAtom); // 사용자 id recoil 저장
    const [isUserInfo, setIsUserInfo] = useRecoilState(UserDetailAvailableAtom); // 사용자 정보 사용 가능 여부
    const loginInfo = useRecoilValue(LoginAtom); // 사용자 이름 가져오기

    // 취미 추천 페이지로 이동
    const navigate = useNavigate();

    // 순서
    const userCurrentOrder = useRef(0);
    const botCurrentOrder = useRef(0);

    // 답변 기록 저장
    const [userInput, setUserInput] = useState('');
    const [userHistory, setUserHistory] = useState(history);
    const [botHistory, setBotHistory] = useState(history);

    // 화면 표시 여부
    const [userShow, setUserShow] = useState(Array(30).fill(false));
    const [botShow, setBotShow] = useState(
        Array(30).fill(false).fill(true, 0, 1),
    );

    // 버튼 타입 (기본 or 취미 선택)
    const [buttonType, setButtonType] = useState<'default' | 'hobby'>(
        'default',
    );

    // 버튼 이름 목록 저장
    const [botButton, setBotButton] =
        useState<{ order: number; buttons: string[] }[]>(buttonHistory);

    // 선택된 취미 리스트
    const [selectedHobby, setSelectedHobby] = useState<string[]>([]);

    // 스크롤할 컴포넌트
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollToBottom();
    }, [userShow, botShow, userHistory, botHistory]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            (scrollRef.current as HTMLDivElement).scrollTop = (
                scrollRef.current as HTMLDivElement
            ).scrollHeight;
        }
    };

    // input 관리
    const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserInput(e.target.value);
    };

    // 1. 전송 버튼 클릭 처리
    const handleSubmitClick = async ({
        e,
        choice,
    }: {
        e?: React.FormEvent<HTMLFormElement>;
        choice?: string;
    }) => {
        e?.preventDefault(); // 새로고침 방지

        const messageToSend = choice || userInput;

        if (!!messageToSend) {
            // 1-1. 사용자 입력값 저장
            setUserBubble({ message: messageToSend });

            // 해당 순서의 사용자 말풍선 보여주기 허용
            let copy = [...userShow];
            copy[userCurrentOrder.current] = true;
            setUserShow(copy);
            userCurrentOrder.current += 1;

            try {
                // 1-2. 사용자 입력 전송
                const data = await sendMessage(messageToSend);
                // 1-3. dialogflow 답변 저장
                handleResponse(data);
            } catch (error) {
                console.log(error);
            }

            // input 창 초기화
            setUserInput('');

            // 다음 순서의 챗봇 반응 보여주기 허용
            setTimeout(() => {
                let copy = [...botShow];
                copy[botCurrentOrder.current] = true;
                setBotShow(copy);
            }, 0);
            botCurrentOrder.current += 1;
        }
    };

    // 1. 버튼으로 입력을 받는 경우
    const handleButtonClick = (
        { choice }: { choice: string },
        e: React.MouseEvent<HTMLDivElement>,
    ) => {
        e.preventDefault(); // 버튼 클릭에 대한 새로고침 방지
        handleSubmitClick({ choice: choice });
    };

    // 1-1. 사용자 말풍선에 userInput 반영하기
    const setUserBubble = ({ message }: { message: string }) => {
        setUserHistory(
            userHistory.map((h) =>
                h.order == userCurrentOrder.current
                    ? { ...h, text: message }
                    : h,
            ),
        );
    };

    // 1-2. 사용자 입력 내용 보내기 api
    const sendMessage = async (message: string | string[]) => {
        try {
            const res = await http.post(`/send_message`, { message });
            return res.data;
        } catch (error) {
            console.log(error);
        }
    };

    // 1-3. Dialogflow의 답변 저장
    const handleResponse = (data: any) => {
        // 취미가 있는 경우 -> 기존 취미 입력 받기
        if (data.action === 'yes_hobby') {
            const categories = Object.keys(collabHobbyIcons);

            let buttonNames: string[] = [];
            categories.forEach((category) => {
                buttonNames = buttonNames.concat(
                    Object.keys(collabHobbyIcons[category]),
                );
            });

            setButtonType('hobby');

            setBotButton(
                botButton.map((h) =>
                    h.order === botCurrentOrder.current
                        ? {
                              ...h,
                              buttons: buttonNames,
                          }
                        : h,
                ),
            );
        }

        // 버튼으로 입력을 받는 경우
        if (data.data.buttons) {
            const buttonNames = data.data.buttons.map(
                (button: any) => button.name,
            );

            setBotButton(
                botButton.map((h) =>
                    h.order == botCurrentOrder.current
                        ? {
                              ...h,
                              buttons: buttonNames,
                          }
                        : h,
                ),
            );
        }

        // 정보 입력이 다 끝난 경우
        if (data.action === 'end') {
            fetchData({ existing_hobby: false });

            // 취미 추천 페이지로 이동
            setTimeout(() => {
                navigate(`/recommend`);
            }, 4000);
        }

        // 챗봇 답변 화면에 보이게 하기
        setBotHistory(
            botHistory.map((h) =>
                h.order == botCurrentOrder.current
                    ? {
                          ...h,
                          text: data.message,
                      }
                    : h,
            ),
        );
    };

    // 2. 사용자 정보, 추천 취미 리스트 recoil 저장 함수
    const fetchData = async ({
        existing_hobby,
    }: {
        existing_hobby: boolean;
    }) => {
        try {
            const res = await http.get(`/webhook`);

            // 사용자 id 받아오기
            getUserId({ userDetail });

            // 추천 취미 데이터 배열 형태로 변환
            const recommendations = res.data.recommendations;
            const categoryArr =
                res.data.recommendations[
                    recommendations.length - 1
                ].categories.split(', ');
            const hobbyArr =
                res.data.recommendations[
                    recommendations.length - 1
                ].hobbies.split(', ');

            // 기존의 취미가 있는 경우
            if (existing_hobby) {
                const userDetail = {
                    age: 0,
                    gender: '',
                    location: '',
                    income: '',
                    motive: '',
                    weekday: 0,
                    weekend: 0,
                };

                setUserDetail(userDetail);
                setIsUserInfo({ available: false });
            } else {
                // 기존의 취미가 없는 경우
                const userDetail = {
                    age: res.data.user_inputs.age,
                    gender: res.data.user_inputs.gender,
                    location: res.data.user_inputs.location,
                    income: res.data.user_inputs.income,
                    motive: res.data.user_inputs.motive,
                    weekday: res.data.user_inputs.weekday,
                    weekend: res.data.user_inputs.weekend,
                };

                setUserDetail(userDetail);
                setIsUserInfo({ available: true });
            }

            // 추천 취미 저장
            setRecommend({
                hobby1: hobbyArr[0],
                category1: categoryArr[0],
                similarity1: 86,
                hobby2: hobbyArr[1],
                category2: categoryArr[1],
                similarity2: 75,
                hobby3: hobbyArr[2],
                category3: categoryArr[2],
                similarity3: 62,
            });
        } catch (error) {
            console.log(error);
        }
    };

    // 3. 사용자 정보 post 후 id 받아오기
    const getUserId = ({ userDetail }: { userDetail: UserDetail }) => {
        const userInfo = {
            name: loginInfo.name,
            age: userDetail.age,
            gender: userDetail.gender,
            home: userDetail.location,
            income: userDetail.income,
            motive: userDetail.motive,
            work: userDetail.weekday,
            wkend: userDetail.weekend,
        };

        // 사용자 정보 post api
        saveUserInfo({ userInfo }).then((res) => {
            setUserId({ id: res?.data.id });
        });
    };

    // 기존 취미가 있는 경우
    // 기존 취미 선택 처리
    const handleHobbyClick = ({ choice }: { choice: string }) => {
        const isSelected = selectedHobby.includes(choice);
        const updatedButtons = isSelected
            ? selectedHobby.filter((button) => button !== choice)
            : [...selectedHobby, choice];
        setSelectedHobby(updatedButtons);
        console.log(updatedButtons);
    };

    // 기존 취미 제출
    const handleHobbySubmit = async (
        e: React.MouseEvent<HTMLFormElement, MouseEvent>,
    ) => {
        e.preventDefault();

        setBotHistory(
            botHistory.map((h) =>
                h.order === botCurrentOrder.current
                    ? {
                          ...h,
                          text: '감사합니다. 잘 반영해서 사용자님께 딱 맞는 취미를 추천해드리겠습니다!',
                      }
                    : h,
            ),
        );

        // 다음 순서의 챗봇 반응 보여주기 허용
        setTimeout(() => {
            let copy = [...botShow];
            copy[botCurrentOrder.current] = true;
            setBotShow(copy);
        }, 0);
        botCurrentOrder.current += 1;

        // 선택 완료 버튼 제거
        setButtonType('default');

        // 선택 취미 리스트 post api
        try {
            const res = await http.post(`/hobbylist`, { selectedHobby });
        } catch (error) {
            console.log(error);
        }

        // 추천 취미 저장
        fetchData({ existing_hobby: true });

        // 취미 추천 페이지로 이동
        setTimeout(() => {
            navigate(`/recommend`);
        }, 4000);
    };

    return (
        <Wrapper>
            <Navbar />
            <Container ref={scrollRef}>
                <BotBubbleWrapper>
                    <Profile>
                        <img src={bot} />
                    </Profile>
                    <div className="space">
                        <BotBubble>
                            <p>
                                안녕하세요! 간단한 대화를 통해 맞춤형 취미를
                                찾아보세요!
                            </p>
                        </BotBubble>
                    </div>
                </BotBubbleWrapper>

                {userHistory.map((user, index) => (
                    <>
                        {userShow[index] && (
                            <UserBubbleWrapper>
                                <UserBubble>{user.text}</UserBubble>
                            </UserBubbleWrapper>
                        )}
                        {botShow[index + 1] && (
                            <BotBubbleWrapper>
                                <Profile>
                                    <img src={bot} />
                                </Profile>
                                <div className="space">
                                    <BotBubble>
                                        {botHistory[index].text}
                                    </BotBubble>
                                    {botButton[index].buttons[0] && (
                                        <ButtonWrapper>
                                            {botButton[index].buttons.map(
                                                (name, idx) => (
                                                    <Button
                                                        key={idx}
                                                        onClick={(e) =>
                                                            buttonType ===
                                                            'default'
                                                                ? handleButtonClick(
                                                                      {
                                                                          choice: name,
                                                                      },
                                                                      e,
                                                                  )
                                                                : handleHobbyClick(
                                                                      {
                                                                          choice: name,
                                                                      },
                                                                  )
                                                        }
                                                        style={{
                                                            backgroundColor:
                                                                selectedHobby.includes(
                                                                    name,
                                                                )
                                                                    ? 'var(--blue2)'
                                                                    : 'white',
                                                        }}
                                                    >
                                                        {name}
                                                    </Button>
                                                ),
                                            )}
                                        </ButtonWrapper>
                                    )}
                                </div>
                            </BotBubbleWrapper>
                        )}
                    </>
                ))}
                {buttonType == 'default' ? ( // 기본 선택 버튼
                    <>
                        <InputForm
                            onSubmit={(e) => handleSubmitClick({ e: e })}
                        >
                            <InputBox>
                                <input
                                    type="text"
                                    value={userInput}
                                    placeholder="작성해주세요"
                                    onChange={onChangeInput}
                                />
                            </InputBox>
                            <SendButton type="submit">
                                <img src={arrow} />
                            </SendButton>
                        </InputForm>
                    </>
                ) : (
                    // 취미 고르기 버튼
                    <CompleteButton onClick={handleHobbySubmit}>
                        선택 완료
                    </CompleteButton>
                )}
            </Container>
        </Wrapper>
    );
};

export default ChatbotPage;

const Wrapper = styled.div`
    height: 100vh;
    background-color: var(--blue1);
    background-image: linear-gradient(to top, var(--blue2) 0%, transparent 70%);
    background-size: cover;
    position: relative;
    overflow-y: scroll;

    @media (min-width: 650px) {
        overflow-x: hidden;
        background-color: white;
        background-image: none;

        &::-webkit-scrollbar {
            display: none;
        }
    }
`;

export const Container = styled.div`
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 25px 20px;
    padding-bottom: 50px;
    overflow-y: auto;

    @media (min-width: 650px) {
        width: calc(640px - var(--sidebar) - 30px);
        padding: 15px;
        padding-bottom: 55px;
        position: absolute;
        right: 0;
        background-color: var(--blue1);
        background-image: linear-gradient(
            to top,
            var(--blue2) 0%,
            transparent 70%
        );
    }

    &::-webkit-scrollbar {
        display: none;
    }
`;

const BotBubbleWrapper = styled.div`
    display: flex;

    .space {
        padding-top: 20px;
    }
`;

const Profile = styled.div`
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 10px;

    img {
        ${ImgStyle}
    }

    @media (min-width: 650px) {
        width: 35px;
        height: 35px;
    }
`;

const BotBubble = styled.div`
    width: auto;
    height: auto;
    min-width: 150px;
    max-width: 80%;
    padding: 12px 15px;
    background-color: white;
    color: black;
    font-size: 16px;
    line-height: 20px;
    border-radius: 0px 20px 20px 20px;
    box-shadow: var(--popup-shadow);
    margin-bottom: 20px;

    @media (min-width: 650px) {
        font-size: 14px;
        line-height: 18px;
        padding: 10px 12px;
    }
`;

const UserBubbleWrapper = styled.div`
    display: flex;
    justify-content: end;
`;

const UserBubble = styled.div`
    width: auto;
    height: auto;
    max-width: 80%;
    padding: 12px;
    background-color: var(--blue4);
    color: white;
    font-size: 16px;
    line-height: 20px;
    border-radius: 20px 20px 0px 20px;
    box-shadow: var(--popup-shadow);

    @media (min-width: 650px) {
        font-size: 14px;
        line-height: 18px;
        padding: 10px 12px;
    }
`;

const InputForm = styled.form`
    width: 100%;
    height: 56px;
    display: flex;
    align-items: center;
    background-color: white;

    position: fixed;
    bottom: 0;
    left: 0;

    @media (min-width: 650px) {
        width: 440px;
        margin-left: calc((100% - 640px) / 2);
        height: 40px;
        left: var(--sidebar);
    }
`;

const InputBox = styled.div`
    width: 100%;
    padding: 0 10px;

    input {
        width: 100%;
        display: flex;
        align-items: center;
        font-size: 16px;
    }

    @media (min-width: 650px) {
        input {
            font-size: 14px;
        }
    }
`;

const SendButton = styled.button`
    width: 56px;
    height: 56px;
    background-color: var(--blue4);
    padding: 10px;
    border-radius: 4px;

    img {
        ${ImgStyle}
    }

    @media (min-width: 650px) {
        width: 40px;
        height: 40px;
    }
`;

const CompleteButton = styled(InputForm)`
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--blue4);
    color: white;

    @media (min-width: 650px) {
        height: 45px;

        &:hover {
            background-color: var(--blue1);
            color: var(--blue4);
            transition: background-color 200ms ease-in-out;
            cursor: pointer;
        }
    }
`;

const ButtonWrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
`;

const Button = styled.div`
    padding: 10px 12px;
    border-radius: 20px;
    background-color: white;
    border: 1px solid var(--blue4);
    margin: -8px 8px 20px 0;
    box-shadow: var(--popup-shadow);
    font-size: 16px;

    &:hover {
        background-color: var(--blue1);
        cursor: pointer;
        transition: background-color 200ms ease-in-out;
    }
    &:active {
        background-color: var(--blue1);
    }

    @media (min-width: 650px) {
        padding: 8px 10px;
        font-size: 12px;

        &:hover {
            background-color: var(--blue1);
            cursor: pointer;
            transition: background-color 200ms ease-in-out;
        }
    }
`;
