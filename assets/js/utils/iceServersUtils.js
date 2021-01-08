module.exports = {
  getIceServerType: (controlVariable) => {
    switch (controlVariable) {
      case 0:
        return "0-Null_ICE_SERVER";
      case 1:
        return "1-ALL STUN";
      case 2:
        return "2-AVM_TURN_UDP_3478";
      case 3:
        return "3-AVM_TURN_UDP_5349";
      case 4:
        return "4-AVM_TURN_TCP_3478";
      case 5:
        return "5-AVM_TURN_TCP_5349";
      case 6:
        return "6-AVM_TURN_3478";
      case 7:
        return "7-AVM_TURN_5349";
      case 8:
        return "8-AVM_TURN_:3478_UDP:5349_TCP";
      case 9:
        return "9-XIRSYS_TURN_UDP_80";
      case 10:
        return "10-XIRSYS_TURN_UDP_3478";
      case 11:
        return "11-XIRSYS_TURN_TCP_80";
      case 12:
        return "12-XIRSYS_TURN_TCP_3478";
      case 13:
        return "13-XIRSYS_TURN_TCP_443";
      case 14:
        return "14-XIRSYS_TURN_TCP_5349";
      case 15:
        return "15-AVM_TURN_UDP_3475_TCP_5349";
      case 16:
        return "16-AVM_XIRSYS_STUN_TURN_UDP_TCP_ALL";
      default:
        return "None";
    }
  },
  iceConfigServers: [
    // 0
    { iceServers: [] },
    // 1
    {
      iceServers: [
        {
          urls: [
            "stun:avm4962.com:3478",
            "stun:avm4962.com:5349",
            "stun:ss-turn1.xirsys.com",
          ],
        },
      ],
    },
    // 2
    {
      iceServers: [
        {
          username: "TuR9Us3r",
          credential:
            "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
          urls: ["turn:avm4962.com:3478?transport=udp"],
        },
      ],
    },
    // 3
    {
      iceServers: [
        {
          username: "TuR9Us3r",
          credential:
            "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
          urls: ["turn:avm4962.com:5349?transport=udp"],
        },
      ],
    },
    // 4
    {
      iceServers: [
        {
          username: "TuR9Us3r",
          credential:
            "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
          urls: ["turn:avm4962.com:3478?transport=tcp"],
        },
      ],
    },
    // 5
    {
      iceServers: [
        {
          username: "TuR9Us3r",
          credential:
            "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
          urls: ["turn:avm4962.com:5349?transport=tcp"],
        },
      ],
    },
    // 6
    {
      iceServers: [
        {
          username: "TuR9Us3r",
          credential:
            "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
          urls: ["turn:avm4962.com:3478"],
        },
      ],
    },
    // 7
    {
      iceServers: [
        {
          username: "TuR9Us3r",
          credential:
            "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
          urls: ["turn:avm4962.com:5349"],
        },
      ],
    },
    // 8
    {
      iceServers: [
        {
          username: "TuR9Us3r",
          credential:
            "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
          urls: [
            "turn:avm4962.com:3478?transport=udp",
            "turn:avm4962.com:5349?transport=tcp",
          ],
        },
      ],
    },
    // 9
    {
      iceServers: [
        {
          username:
            "ZyUlEkJOyQDmJFZ0nkKcAKmrrNayVm-rutt8RNHa1EQe_NQADY6Rk4sM2zVstYo_AAAAAF9xt7VhbGl2YXRlY2g=",
          credential: "820f7cf4-0173-11eb-ad8b-0242ac140004",
          urls: ["turn:ss-turn1.xirsys.com:80?transport=udp"],
        },
      ],
    },
    // 10
    {
      iceServers: [
        {
          username:
            "ZyUlEkJOyQDmJFZ0nkKcAKmrrNayVm-rutt8RNHa1EQe_NQADY6Rk4sM2zVstYo_AAAAAF9xt7VhbGl2YXRlY2g=",
          credential: "820f7cf4-0173-11eb-ad8b-0242ac140004",
          urls: ["turn:ss-turn1.xirsys.com:3478?transport=udp"],
        },
      ],
    },
    // 11
    {
      iceServers: [
        {
          username:
            "ZyUlEkJOyQDmJFZ0nkKcAKmrrNayVm-rutt8RNHa1EQe_NQADY6Rk4sM2zVstYo_AAAAAF9xt7VhbGl2YXRlY2g=",
          credential: "820f7cf4-0173-11eb-ad8b-0242ac140004",
          urls: ["turn:ss-turn1.xirsys.com:80?transport=tcp"],
        },
      ],
    },
    // 12
    {
      iceServers: [
        {
          username:
            "ZyUlEkJOyQDmJFZ0nkKcAKmrrNayVm-rutt8RNHa1EQe_NQADY6Rk4sM2zVstYo_AAAAAF9xt7VhbGl2YXRlY2g=",
          credential: "820f7cf4-0173-11eb-ad8b-0242ac140004",
          urls: ["turn:ss-turn1.xirsys.com:3478?transport=tcp"],
        },
      ],
    },
    // 13
    {
      iceServers: [
        {
          username:
            "ZyUlEkJOyQDmJFZ0nkKcAKmrrNayVm-rutt8RNHa1EQe_NQADY6Rk4sM2zVstYo_AAAAAF9xt7VhbGl2YXRlY2g=",
          credential: "820f7cf4-0173-11eb-ad8b-0242ac140004",
          urls: ["turns:ss-turn1.xirsys.com:443?transport=tcp"],
        },
      ],
    },
    // 14
    {
      iceServers: [
        {
          username:
            "ZyUlEkJOyQDmJFZ0nkKcAKmrrNayVm-rutt8RNHa1EQe_NQADY6Rk4sM2zVstYo_AAAAAF9xt7VhbGl2YXRlY2g=",
          credential: "820f7cf4-0173-11eb-ad8b-0242ac140004",
          urls: ["turns:ss-turn1.xirsys.com:5349?transport=tcp"],
        },
      ],
    },
    // 15
    {
      iceServers: [
        {
          urls: ["stun:avm4962.com:3478", "stun:avm4962.com:5349"],
        },
        {
          username: "TuR9Us3r",
          credential:
            "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
          urls: [
            "turn:avm4962.com:3478?transport=udp",
            "turn:avm4962.com:5349?transport=tcp",
          ],
        },
      ],
    },
    // 16
    {
      iceServers: [
        {
          urls: ["stun:avm4962.com:3478", "stun:avm4962.com:5349"],
        },
        { urls: ["stun:ss-turn1.xirsys.com"] },
        {
          username: "TuR9Us3r",
          credential:
            "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
          urls: [
            "turn:avm4962.com:3478?transport=udp",
            "turn:avm4962.com:5349?transport=tcp",
          ],
        },
        {
          username:
            "ZyUlEkJOyQDmJFZ0nkKcAKmrrNayVm-rutt8RNHa1EQe_NQADY6Rk4sM2zVstYo_AAAAAF9xt7VhbGl2YXRlY2g=",
          credential: "820f7cf4-0173-11eb-ad8b-0242ac140004",
          urls: [
            "turn:ss-turn1.xirsys.com:80?transport=udp",
            "turn:ss-turn1.xirsys.com:3478?transport=udp",
            "turn:ss-turn1.xirsys.com:80?transport=tcp",
            "turn:ss-turn1.xirsys.com:3478?transport=tcp",
            "turns:ss-turn1.xirsys.com:443?transport=tcp",
            "turns:ss-turn1.xirsys.com:5349?transport=tcp",
          ],
        },
      ],
    },
  ],
};
