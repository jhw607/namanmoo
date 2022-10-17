<h1 style="color:red">바로알바</h1>

# [프로젝트 소개]

**🌱 알바 매칭 플랫폼**

**🌱 2022.06.30 ~ 2022.08.06(5주/5인)**

**🌱 BAROALBA : [https://heobo.shop](https://heobo.shop)[(미운영중)](https://github.com/sehnara/server_gigtime)**

- **🌱 poster :**
    
    ![image](https://user-images.githubusercontent.com/68524314/196237510-8c158881-7cbd-4373-8ec3-c7fbce054c59.png)
    
- **🌱 youtube :**
    
    [발표 녹화영상 - SW사관학교 정글 바로알바 팀](https://www.youtube.com/watch?v=EM6j4d8KUIQ)
    
    [최종발표 영상 - SW사관학교 정글 바로알바 팀](https://www.youtube.com/watch?v=A0XfqAzDDGw&feature=youtu.be)
    

## 바로알바는

- 주간, 월간 단위의 근무기간이 부담스러운 **알바생**과
- 그래서 알바생을 구하기 힘든 **사장님**을
- 더 짧고 유동적인 시간단위로 **매칭**해주는 서비스입니다.


## 기술 스택

#### FE : `React` `Redux Toolkit` `Type Script` `Tailwind-css`

#### BE : `Node.js` `Express.js`

#### DevOps : `MySQL` `EC2` `RDS` `S3` `Github Actions` `Route 53` `PWA`

## 주요 기능

#### 1. 화상 면접
<!-- ![image](https://user-images.githubusercontent.com/68524314/196235931-e82204e8-4290-4ca2-a70b-f5ee77a3660c.png) -->
#### 2. 알바 예약
<!-- ![image](https://user-images.githubusercontent.com/68524314/196235507-b24e80e9-d758-4361-81e8-95d30d323c41.png) -->
#### 3. 바로 채팅
<!-- ![image](https://user-images.githubusercontent.com/68524314/196235558-ef9c752d-7eb4-4709-aa4a-19cedda8d22e.png) -->
#### 4. 알바 추천
<!-- ![image](https://user-images.githubusercontent.com/68524314/196236361-d737cfe1-d61e-4dad-9d49-97fef78e0136.png) -->
#### 5. QR 출석체크
<!-- ![image](https://user-images.githubusercontent.com/68524314/196236205-e2396afa-c849-434d-ae4d-0fa1b2cda4d4.png) -->
#### 6. 알바천사
<!-- ![image](https://user-images.githubusercontent.com/68524314/196236255-9efcc734-8eb6-4520-99b3-664620e350f0.png) -->


---
# [프로젝트 내 역할]

### 개발 초기
- **플로우차트 작성**
- **세부 기능 기획**
- **회의록 및 아젠다 템플릿 생성**

### 개발 환경 개선
- **라우팅 구축 및 함수 모듈화**
- **쿼리 개선 시도**

### 기능 개발 - Node.js/Express.js
- **면접 신청 및 관리 기능**
    - 면접신청 프로세스 단계에 따른 동작을 구현함        
        → 신청 - 신청결과(수락/거부) - 면접대기 - 화상면접진행 - 결과대기 - 결과확인(합/불합격)        
- **알바천사 기능**
    - (사장님) 알바천사 콜(call) 발동 시 일정 시간 유효
    - 특정 거리 내에 있는 (해당 가게에 대한 근무자격을 보유한) 알바생에게 push 알림
    - (알바생) push 수신 후 수락 가능        
    - 카카오택시 콜을 모티브로 두고 거리를 반영한 push 알림을 통해 긴급하게 알바생을 구하는 기능을 구현함
- **QR 출석체크 기능**
    - 출근 시 QR생성(알바생) 및 스캔(사장님)으로 출결관리
- **Push 구현**
    - Firebase Cloud Messaging 도입

### database 관리 - MySQL

### 테스트 및 디버깅
