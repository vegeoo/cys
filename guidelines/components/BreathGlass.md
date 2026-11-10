# BreathGlass

전체 화면을 자연 풍경 너머의 유리창처럼 만드는 작품의 중심 컴포넌트다.

- 자연 풍경, blur 레이어, 김 서림, Canvas 물방울, 반사광 순서로 겹친다.
- `level = clamp(humidity / 100, 0, 1)`을 CSS 변수와 Canvas에 전달한다.
- Level 0: 낮은 blur, 거의 투명한 fog, 물방울 없음
- Level 0.5: 중간 blur, 옅은 fog, 작은 물방울과 느린 흐름
- Level 1: 강한 blur, 높은 fog, 다양한 크기의 물방울과 빠른 흐름
- 습도가 내려가면 CSS 전환과 Canvas 감쇠로 천천히 맑아진다.
- 배경 이미지는 장식이므로 대체 텍스트를 비우고, 유리 상태는 별도 습도 텍스트로 전달한다.
