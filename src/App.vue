<template>
  <div id="app">
    <!-- 测试 -->
    <router-view  />
  </div>
</template>

<script>

export default {
  name: 'App',
}
</script>

<style lang="less">
#app {
  div,
  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  ul,
  ol {
    box-sizing: border-box;
  }

  p,
  ul

  ol {
    margin: 0;
    outline: 0;
  }
  ul,
  ol {
    padding: 0;
  }

  font-size: 14px;
  font-family: MicrosoftYaHei;
  color: #333333;
}
</style>
