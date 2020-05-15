//Peer ：P2P接続、およびルーム接続機能を操作するためのクラス
//MediaConnection ：接続先Peerへのメディアチャネル接続を管理するクラス
//DataConnection ：接続先Peerへのデータチャネル接続を管理するクラス

//Peerモデルを定義

const Peer = window.Peer;

(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const localId = document.getElementById('js-local-id');
  const callTrigger = document.getElementById('js-call-trigger');
  const closeTrigger = document.getElementById('js-close-trigger');
  const remoteVideo = document.getElementById('js-remote-stream');
  const remoteId = document.getElementById('js-remote-id');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');

  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

  //自分の映像と音声をlocalStreamに代入,メディア入力を使用する許可をユーザーに求めますpromise関数。
  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  // localStreamをdiv(localVideo)に挿入
  localVideo.muted = true;
  localVideo.srcObject = localStream;  //videoタグの箇所へ、カメラの映像を挿入します
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);
// Peer作成,Peerと呼ばれる、通信拠点の単位となるオブジェクトのインスタンスを生成します。
  const peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));

  // clickでイベント発生,特定のイベントが対象に配信されるたびに呼び出される関数
  callTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const mediaConnection = peer.call(remoteId.value, localStream);

    mediaConnection.on('stream', async stream => {
      // Render remote stream for caller
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));
  });
//SkyWayのシグナリングサーバとの接続が成功したタイミングで発生するイベントで取得します。
  peer.once('open', id => (localId.textContent = id));

  // 相手から接続要求が来たタイミングで発生するイベント
  //発生時にmediaConnectionオブジェクトが取得できます
  //mediaConnectionオブジェクトのanswerメソッドにて、カメラ映像取得時に保存しておいたlocalStream変数を引数にとり、 自分のカメラ映像を相手に返します
  peer.on('call', mediaConnection => {
    mediaConnection.answer(localStream);

    mediaConnection.on('stream', async stream => {
      // Render remote stream for callee
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });
//一度だけ実行
    mediaConnection.once('close', () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));
  });
//何らかのエラーが発生した場合に発火します
  peer.on('error', console.error);
})();
