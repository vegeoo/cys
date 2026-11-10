# CondensationCanvas

결로 물방울을 그리는 화면 크기 Canvas다.

- `requestAnimationFrame` 한 개로 애니메이션을 관리한다.
- 물방울 객체는 React state가 아닌 ref 내부 배열에 둔다.
- devicePixelRatio를 반영하되 과도한 해상도는 제한한다.
- 습도에 비례해 목표 물방울 수를 조정하고, 낮아질 때는 opacity와 수명을 줄인다.
- 각 물방울은 x, y, radius, speed, wobble, opacity를 가진다.
- 큰 물방울은 빠르게 흐르고, 가까운 물방울 일부는 합쳐진 것처럼 반지름을 키운다.
- 물방울 뒤에는 destination-out 합성으로 짧은 맑은 자국을 만든다.
- ResizeObserver, 애니메이션 프레임, reduced-motion 미디어 쿼리를 정리한다.
